import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import {
  AddStudentDto,
  AssignAssignmentDto,
  CreateClassDto,
} from "./dto/class.dto";

/** Short join code, e.g. "K7Q2ZP". */
const generateClassCode = (): string =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

@Injectable()
export class ClassService {
  constructor(private readonly prisma: PrismaService) {}

  async listClasses(userId: string) {
    const rows = await this.prisma.class.findMany({
      where: { ownerUserId: userId, isArchived: false },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { enrollments: true, assignments: true } } },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      classCode: row.classCode,
      subject: row.subject,
      term: row.term,
      gradeLevel: row.gradeLevel,
      studentCount: row._count.enrollments,
      assignmentCount: row._count.assignments,
      createdAt: row.createdAt,
    }));
  }

  async createClass(userId: string, dto: CreateClassDto) {
    // classCode is unique — retry with fresh codes before surfacing a clash.
    const candidates = dto.classCode
      ? [dto.classCode]
      : [generateClassCode(), generateClassCode(), generateClassCode()];

    let lastError: unknown;
    for (const classCode of candidates) {
      try {
        return await this.prisma.class.create({
          data: {
            name: dto.name,
            subject: dto.subject,
            term: dto.term,
            gradeLevel: dto.gradeLevel,
            classCode,
            ownerUserId: userId,
            teachers: { create: { userId, role: "OWNER", canEdit: true } },
          },
        });
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) throw lastError;
    throw new ConflictException("Could not create class");
  }

  async getClass(userId: string, classId: number) {
    const found = await this.prisma.class.findFirst({
      where: { id: classId, ownerUserId: userId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { joinedAt: "asc" },
        },
        assignments: {
          include: { assignment: { select: { id: true, name: true } } },
        },
      },
    });
    if (!found) throw new NotFoundException("Class not found");

    return {
      id: found.id,
      name: found.name,
      classCode: found.classCode,
      subject: found.subject,
      term: found.term,
      gradeLevel: found.gradeLevel,
      students: found.enrollments.map((enrollment) => ({
        userId: enrollment.userId,
        displayName: enrollment.displayName,
        studentNo: enrollment.studentNo,
        joinedAt: enrollment.joinedAt,
      })),
      assignments: found.assignments.map((link) => ({
        assignmentId: link.assignmentId,
        name: link.assignment?.name ?? "",
        assignedAt: link.assignedAt,
        dueAt: link.dueAt,
      })),
    };
  }

  async addStudent(userId: string, classId: number, dto: AddStudentDto) {
    await this.assertOwned(userId, classId);

    return this.prisma.classEnrollment.upsert({
      where: { classId_userId: { classId, userId: dto.userId } },
      create: {
        classId,
        userId: dto.userId,
        displayName: dto.displayName,
        studentNo: dto.studentNo,
        status: "ACTIVE",
      },
      update: {
        status: "ACTIVE",
        leftAt: null,
        displayName: dto.displayName ?? undefined,
        studentNo: dto.studentNo ?? undefined,
      },
    });
  }

  /**
   * Soft removal — the enrollment keeps its history so past submissions stay
   * attributable to the class.
   */
  async removeStudent(userId: string, classId: number, studentUserId: string) {
    await this.assertOwned(userId, classId);

    return this.prisma.classEnrollment.update({
      where: { classId_userId: { classId, userId: studentUserId } },
      data: { status: "INACTIVE", leftAt: new Date() },
    });
  }

  async assignAssignment(
    userId: string,
    classId: number,
    dto: AssignAssignmentDto,
  ) {
    await this.assertOwned(userId, classId);

    // Only the author of an assignment may hand it to a class.
    const owns = await this.prisma.assignmentAuthor.findFirst({
      where: { assignmentId: dto.assignmentId, userId },
    });
    if (!owns) {
      throw new ForbiddenException("You do not author this assignment");
    }

    return this.prisma.assignmentClass.upsert({
      where: {
        assignmentId_classId: { assignmentId: dto.assignmentId, classId },
      },
      create: {
        assignmentId: dto.assignmentId,
        classId,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      },
      update: { dueAt: dto.dueAt ? new Date(dto.dueAt) : null },
    });
  }

  /** Archive rather than delete: submissions still reference the class. */
  async archiveClass(userId: string, classId: number) {
    await this.assertOwned(userId, classId);

    return this.prisma.class.update({
      where: { id: classId },
      data: { isArchived: true },
    });
  }

  private async assertOwned(userId: string, classId: number) {
    const found = await this.prisma.class.findFirst({
      where: { id: classId, ownerUserId: userId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException("Class not found");
    return found;
  }
}
