export type ProjectStatus = 'current' | 'preserved' | 'paused';

export interface Project {
	slug?: string;
	title: string;
	year: string;
	category: string;
	team?: string;
	role: string;
	tech: string[];
	link?: string;
	status: ProjectStatus;
	image?: string;
}
