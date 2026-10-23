import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from "@nestjs/common";
import {
  UserRole,
  UserSessionRequest,
} from "src/auth/interfaces/user.session.interface";
import { Roles } from "src/auth/role/roles.global.guard";
import { ClassService } from "./class.service";
import {
  AddStudentDto,
  AssignAssignmentDto,
  CreateClassDto,
} from "./dto/class.dto";

@Controller({ path: "classes", version: "1" })
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get()
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async listClasses(@Req() request: UserSessionRequest) {
    return this.classService.listClasses(request.userSession.userId);
  }

  @Post()
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async createClass(
    @Req() request: UserSessionRequest,
    @Body() body: CreateClassDto,
  ) {
    return this.classService.createClass(request.userSession.userId, body);
  }

  @Get(":id")
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async getClass(
    @Req() request: UserSessionRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.classService.getClass(request.userSession.userId, id);
  }

  @Post(":id/students")
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async addStudent(
    @Req() request: UserSessionRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: AddStudentDto,
  ) {
    return this.classService.addStudent(request.userSession.userId, id, body);
  }

  @Delete(":id/students/:userId")
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async removeStudent(
    @Req() request: UserSessionRequest,
    @Param("id", ParseIntPipe) id: number,
    @Param("userId") userId: string,
  ) {
    return this.classService.removeStudent(
      request.userSession.userId,
      id,
      userId,
    );
  }

  @Post(":id/assignments")
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async assignAssignment(
    @Req() request: UserSessionRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: AssignAssignmentDto,
  ) {
    return this.classService.assignAssignment(
      request.userSession.userId,
      id,
      body,
    );
  }

  @Delete(":id")
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async archiveClass(
    @Req() request: UserSessionRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.classService.archiveClass(request.userSession.userId, id);
  }
}
