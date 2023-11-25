// 可查看各个配置项效果：https://prettier.io/playground

// /** @type {import("prettier").Options} */

const config = {
  printWidth: 120, // 每行最大长度，超过便换行
  tabWidth: 2, // 行缩进的空格或者tab符数量
  useTabs: false, // 行缩进使用tab符代替空格
  embeddedLanguageFormatting: 'off', // 在markdown等语言中遇到js等语言格式化js等
  singleQuote: true, // 使用单引号
  bracketSpacing: true, // { a:1 }包含空格
  proseWrap: 'never', // markdown等标记语言达到最大长度换行
  bracketSameLine: false, // <div {...} >中的>在属性太长时不换行
  singleAttributePerLine: false, // jsx、html和vue每个属性占一行
  semi: true, //js语句后加分号
  jsxSingleQuote: false, // jsx属性等使用单引号
  quoteProps: 'as-needed', // js对象key使用双引号
  arrowParens: 'avoid', // 箭头函数只有一个参数时不加括号
  trailingComma: 'all', // 多行逗号结构中结尾增加逗号
};

export default config;
