/** 简历解析状态 */
export const PARSE_STATUS = {
	PENDING: 'pending',
	PARSING: 'parsing',
	COMPLETED: 'completed',
	FAILED: 'failed',
} as const;

export type ParseStatus = (typeof PARSE_STATUS)[keyof typeof PARSE_STATUS];

/** 语言能力 */
export interface LanguageSkill {
	language: string;
	level: string;
}

/** 工作经历 */
export interface WorkExperience {
	id: string;
	profileId: string;
	company: string;
	position: string;
	startDate: string;
	endDate: string;
	description: string;
	sortOrder: number;
}

/** 教育经历 */
export interface EducationRecord {
	id: string;
	profileId: string;
	school: string;
	major: string;
	degree: string;
	startDate: string;
	endDate: string;
	sortOrder: number;
}

/** 项目经验 */
export interface ProjectExperience {
	id: string;
	profileId: string;
	projectName: string;
	role: string;
	startDate: string;
	endDate: string;
	description: string;
	sortOrder: number;
}

/** 简历信息主体 */
export interface ResumeProfile {
	id: string;
	candidateId: string;
	jobId: string;
	jobTitle: string;
	name: string;
	gender: string;
	birthDate: string;
	phone: string;
	email: string;
	city: string;
	highestEducation: string;
	school: string;
	major: string;
	workYears: number;
	expectedSalary: string;
	skills: string[];
	certificates: string[];
	languages: LanguageSkill[];
	selfEvaluation: string;
	rawText: string;
	parseStatus: ParseStatus;
	parseError: string;
	createdAt: string;
	updatedAt: string;
}

/** AI 解析返回的结构化数据 */
export interface ParsedResumeData {
	name: string | null;
	gender: string | null;
	birthDate: string | null;
	phone: string | null;
	email: string | null;
	city: string | null;
	highestEducation: string | null;
	school: string | null;
	major: string | null;
	workYears: number | null;
	expectedSalary: string | null;
	skills: string[];
	certificates: string[];
	languages: LanguageSkill[];
	selfEvaluation: string | null;
	workExperiences: Omit<WorkExperience, 'id' | 'profileId' | 'sortOrder'>[];
	educationHistory: Omit<EducationRecord, 'id' | 'profileId' | 'sortOrder'>[];
	projectExperiences: Omit<ProjectExperience, 'id' | 'profileId' | 'sortOrder'>[];
}

/** 带子表的完整 Resume Profile */
export interface ResumeProfileFull extends ResumeProfile {
	workExperiences: WorkExperience[];
	educationHistory: EducationRecord[];
	projectExperiences: ProjectExperience[];
}
