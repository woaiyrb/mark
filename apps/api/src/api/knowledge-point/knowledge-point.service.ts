import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import {
  AttachQuestionDto,
  CreateKnowledgePointDto,
} from "./dto/knowledge-point.dto";

@Injectable()
export class KnowledgePointService {
  constructor(private readonly prisma: PrismaService) {}

  async listKnowledgePoints(userId: string, subject?: string) {
    const rows = await this.prisma.knowledgePoint.findMany({
      where: {
        isActive: true,
        OR: [{ ownerUserId: userId }, { ownerUserId: null }],
        ...(subject ? { subject } : {}),
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
      include: { _count: { select: { questions: true } } },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      subject: row.subject,
      level: row.level,
      parentId: row.parentId,
      questionCount: row._count.questions,
      createdAt: row.createdAt,
    }));
  }

  async createKnowledgePoint(userId: string, dto: CreateKnowledgePointDto) {
    return this.prisma.knowledgePoint.create({
      data: {
        name: dto.name,
        code: dto.code,
        subject: dto.subject,
        parentId: dto.parentId,
        level: dto.level ?? 1,
        ownerUserId: userId,
      },
    });
  }

  /** Questions tagged with this point, with their assignment for context. */
  async questionsOf(knowledgePointId: number) {
    const links = await this.prisma.questionKnowledgePoint.findMany({
      where: { knowledgePointId },
      include: {
        question: {
          select: {
            id: true,
            question: true,
            assignmentId: true,
            assignment: { select: { name: true } },
          },
        },
      },
    });

    return links.map((link) => ({
      linkId: link.id,
      questionId: link.questionId,
      question: link.question?.question ?? "",
      assignmentId: link.question?.assignmentId ?? 0,
      assignmentName: link.question?.assignment?.name ?? "",
      weight: link.weight,
      isPrimary: link.isPrimary,
    }));
  }

  /** Tag a question. Only the author of its assignment may do this. */
  async attachQuestion(userId: string, dto: AttachQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      select: { assignmentId: true },
    });
    if (!question) throw new NotFoundException("Question not found");

    const owns = await this.prisma.assignmentAuthor.findFirst({
      where: { assignmentId: question.assignmentId, userId },
    });
    if (!owns) {
      throw new ForbiddenException("You do not author this assignment");
    }

    return this.prisma.questionKnowledgePoint.upsert({
      where: {
        questionId_knowledgePointId: {
          questionId: dto.questionId,
          knowledgePointId: dto.knowledgePointId,
        },
      },
      create: {
        questionId: dto.questionId,
        knowledgePointId: dto.knowledgePointId,
        weight: dto.weight ?? 1,
        isPrimary: dto.isPrimary ?? false,
      },
      update: {
        weight: dto.weight ?? undefined,
        isPrimary: dto.isPrimary ?? undefined,
      },
    });
  }

  async detachQuestion(userId: string, linkId: number) {
    const link = await this.prisma.questionKnowledgePoint.findUnique({
      where: { id: linkId },
      include: { question: { select: { assignmentId: true } } },
    });
    if (!link) throw new NotFoundException("Link not found");

    const owns = await this.prisma.assignmentAuthor.findFirst({
      where: { assignmentId: link.question.assignmentId, userId },
    });
    if (!owns) {
      throw new ForbiddenException("You do not author this assignment");
    }

    await this.prisma.questionKnowledgePoint.delete({ where: { id: linkId } });
    return { deleted: true };
  }

  /** Deactivate instead of deleting so linked history stays readable. */
  async archiveKnowledgePoint(userId: string, id: number) {
    const point = await this.prisma.knowledgePoint.findFirst({
      where: { id, ownerUserId: userId },
      select: { id: true },
    });
    if (!point) throw new NotFoundException("Knowledge point not found");

    return this.prisma.knowledgePoint.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
