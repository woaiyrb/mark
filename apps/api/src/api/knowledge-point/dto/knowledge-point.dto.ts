import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateKnowledgePointDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  subject?: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsInt()
  level?: number;
}

export class AttachQuestionDto {
  @IsInt()
  questionId: number;

  @IsInt()
  knowledgePointId: number;

  /** How strongly this question probes the point (default 1). */
  @IsOptional()
  @IsInt()
  weight?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
