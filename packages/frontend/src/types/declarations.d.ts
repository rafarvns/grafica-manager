// Declaração global para CSS Modules — permite importar *.module.css sem erros de tipo
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*?url' {
  const url: string;
  export default url;
}
