import color from 'picocolors';
import { logger } from '../logger';
import type { BundlerPluginInstance, RsbuildPlugin } from '../types';

type RsdoctorExports = {
  RsdoctorRspackPlugin: { new (): BundlerPluginInstance };
  RsdoctorWebpackPlugin: { new (): BundlerPluginInstance };
};

export const pluginRsdoctor = (): RsbuildPlugin => ({
  name: 'rsbuild:rsdoctor',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      if (process.env.RSDOCTOR !== 'true') {
        return;
      }

      const isRspack = api.context.bundlerType === 'rspack';
      const packageName = isRspack
        ? '@rsdoctor/rspack-plugin'
        : '@rsdoctor/webpack-plugin';

      let module: RsdoctorExports;

      try {
        const path = require.resolve(packageName, {
          paths: [api.context.rootPath],
        });
        module = await import(path);
      } catch (err) {
        logger.warn(
          `\`process.env.RSDOCTOR\` enabled, please install ${color.bold(color.yellow(packageName))} package.`,
        );
        return;
      }

      const pluginName = isRspack
        ? 'RsdoctorRspackPlugin'
        : 'RsdoctorWebpackPlugin';

      if (!module || !module[pluginName]) {
        return;
      }

      if (chain.plugins.has(CHAIN_ID.PLUGIN.RSDOCTOR)) {
        return;
      }

      chain.plugin(CHAIN_ID.PLUGIN.RSDOCTOR).use(module[pluginName]);

      logger.info(`${color.bold(color.yellow(packageName))} enabled.`);
    });
  },
});
