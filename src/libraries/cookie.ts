export const filterInvalidText=(str:string)=>{
    const result=str.match(/\w+=[-\w]+/g);
    return result?.join(';') || ''
}