import esbuildPluginTsc from 'esbuild-plugin-tsc';

export default () => ({
  bundle: true,
  minify: true,
  keepNames: true,
  sourcemap: false,
  exclude: [
    '@aws-sdk/*',
    'sharp',
  ],
  external: [
    '@aws-sdk/*',
    'sharp',
  ],
  plugins: [
    esbuildPluginTsc(),
  ],
});
