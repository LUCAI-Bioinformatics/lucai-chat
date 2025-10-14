module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-prefix-selector')({
      prefix: '#lucai-app',
      exclude: ['html','body',':root'],
      transform(prefix, selector, pref) {
        if (selector.startsWith(prefix)) return selector;
        if (selector.startsWith('@')) return selector;
        return pref;
      },
    }),
    require('autoprefixer'),
  ],
};
