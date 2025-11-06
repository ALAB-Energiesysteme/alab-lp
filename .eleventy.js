module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/.nojekyll");
  eleventyConfig.addPassthroughCopy({ "src/pv-zuhause/_sections": "pv-zuhause/_sections" });
  eleventyConfig.addPassthroughCopy({ "src/pv-gewerbe/_sections": "pv-gewerbe/_sections" });

  return {
    dir: { input: "src", output: "docs", includes: "_includes", layouts: "_layouts" },
    templateFormats: ["njk","html","md"],
    htmlTemplateEngine: "njk"
  };
};
