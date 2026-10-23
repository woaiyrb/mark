import { Module } from "@nestjs/common";
import { KnowledgePointController } from "./knowledge-point.controller";
import { KnowledgePointService } from "./knowledge-point.service";

@Module({
  controllers: [KnowledgePointController],
  providers: [KnowledgePointService],
  exports: [KnowledgePointService],
})
export class KnowledgePointModule {}
