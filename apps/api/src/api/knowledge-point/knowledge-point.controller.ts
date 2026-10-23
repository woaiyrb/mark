import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import {
  UserRole,
  UserSessionRequest,
} from "src/auth/interfaces/user.session.interface";
import { Roles } from "src/auth/role/roles.global.guard";
import {
  AttachQuestionDto,
  CreateKnowledgePointDto,
} from "./dto/knowledge-point.dto";
import { KnowledgePointService } from "./knowledge-point.service";

@Controller({ path: "knowledge-points", version: "1" })
export class KnowledgePointController {
  constructor(private readonly knowledgePointService: KnowledgePointService) {}

  @Get()
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async listKnowledgePoints(
    @Req() request: UserSessionRequest,
    @Query("subject") subject?: string,
  ) {
    return this.knowledgePointService.listKnowledgePoints(
      request.userSession.userId,
      subject,
    );
  }

  @Post()
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async createKnowledgePoint(
    @Req() request: UserSessionRequest,
    @Body() body: CreateKnowledgePointDto,
  ) {
    return this.knowledgePointService.createKnowledgePoint(
      request.userSession.userId,
      body,
    );
  }

  @Get(":id/questions")
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async questionsOf(@Param("id", ParseIntPipe) id: number) {
    return this.knowledgePointService.questionsOf(id);
  }

  @Post("questions")
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async attachQuestion(
    @Req() request: UserSessionRequest,
    @Body() body: AttachQuestionDto,
  ) {
    return this.knowledgePointService.attachQuestion(
      request.userSession.userId,
      body,
    );
  }

  @Delete("questions/:linkId")
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async detachQuestion(
    @Req() request: UserSessionRequest,
    @Param("linkId", ParseIntPipe) linkId: number,
  ) {
    return this.knowledgePointService.detachQuestion(
      request.userSession.userId,
      linkId,
    );
  }

  @Delete(":id")
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async archiveKnowledgePoint(
    @Req() request: UserSessionRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.knowledgePointService.archiveKnowledgePoint(
      request.userSession.userId,
      id,
    );
  }
}
