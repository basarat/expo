import fs from 'fs/promises';
import { Server } from 'metro';
import path from 'path';

import { env } from '../../../utils/env';
import { upsertGitIgnoreContents, removeFromGitIgnore } from '../../../utils/mergeGitIgnorePaths';
import { ensureDotExpoProjectDirectoryInitialized } from '../../project/dotExpo';
import { ServerLike } from '../BundlerDevServer';
import { removeExpoEnvDTS, writeExpoEnvDTS } from './expo-env';
import { setupTypedRoutes } from './routes';
import { forceRemovalTSConfig, forceUpdateTSConfig } from './tsconfig';

export interface TypeScriptTypeGenerationOptions {
  server: ServerLike;
  metro?: Server | null;
  projectRoot: string;
}

export async function typescriptTypeGeneration({
  metro,
  projectRoot,
  server,
}: TypeScriptTypeGenerationOptions) {
  const gitIgnorePath = path.join(projectRoot, '.gitignore');
  if (!env.EXPO_USE_TYPED_ROUTES) {
    await Promise.all([
      forceRemovalTSConfig(projectRoot),
      removeExpoEnvDTS(projectRoot),
      removeFromGitIgnore(gitIgnorePath, 'expo-env.d.ts'),
    ]);
    return;
  }

  const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
  const typesDirectory = path.resolve(dotExpoDir, './types');

  // Ensure the types directory exists.
  await fs.mkdir(typesDirectory, { recursive: true });

  await Promise.all([
    upsertGitIgnoreContents(path.join(projectRoot, '.gitignore'), 'expo-env.d.ts'),
    writeExpoEnvDTS(projectRoot),
    forceUpdateTSConfig(projectRoot),
    setupTypedRoutes({ metro, server, typesDirectory, projectRoot }),
  ]);
}
