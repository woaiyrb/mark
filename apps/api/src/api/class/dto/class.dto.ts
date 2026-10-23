import { IsInt, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateClassDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  term?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  gradeLevel?: string;

  /** Optional join code; a random one is generated when omitted. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  classCode?: string;
}

export class AddStudentDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  studentNo?: string;
}

export class AssignAssignmentDto {
  @IsInt()
  assignmentId: number;

  /** ISO timestamp; overrides the assignment-level due date for this class. */
  @IsOptional()
  @IsString()
  dueAt?: string;
}
