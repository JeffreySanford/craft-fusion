import { getJestProjectsAsync } from '@nx/jest';

export default async () => ({
  rootDir: '.',
  projects: await getJestProjectsAsync(),
});
