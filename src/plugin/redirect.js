export default function (context, options) {
  return {
    name: 'redirect-plugin',
    injectHtmlTags({content}) {
      return {
        headTags: [
          {
            tagName: 'script',
            attributes: {
              type: 'text/javascript',
            },
            innerHTML: `
              if (window.location.host === 'fury.apache.org') {
                window.location.href = 'https://fory.apache.org';
              }

              // Backwards compatibility: Redirect old double "docs" URLs to cleaner URLs
              // Redirect /docs/{version}/docs/guide/* to /docs/{version}/guide/*
              // Also handles locale prefixes like /zh-CN/docs/...
              (function() {
                var path = window.location.pathname;
                var sections = ['guide', 'introduction', 'start'];
                // Match patterns like:
                // /docs/docs/guide/... or /docs/next/docs/guide/... or /docs/0.14/docs/guide/...
                // Also with locale: /zh-CN/docs/docs/guide/... or /zh-CN/docs/next/docs/guide/...
                var localePrefix = '(?:\\/[a-z]{2}-[A-Z]{2})?';
                var versionPrefix = '(?:\\/(?:next|[0-9]+\\.[0-9]+))?';

                for (var i = 0; i < sections.length; i++) {
                  var section = sections[i];
                  // Pattern: /docs/{optionalVersion}/docs/{section}/...
                  // Redirect to: /docs/{optionalVersion}/{section}/...
                  var pattern = new RegExp(
                    '^(' + localePrefix + '\\/docs' + versionPrefix + ')\\/docs\\/' + section + '(\\/.*)?$'
                  );
                  var match = path.match(pattern);
                  if (match) {
                    var prefix = match[1];
                    var suffix = match[2] || '';
                    var newPath = prefix + '/' + section + suffix;
                    window.location.replace(newPath + window.location.search + window.location.hash);
                    return;
                  }
                }
              })();
            `
          },
        ],
      };
    },
  };
}
