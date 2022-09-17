export const getCookieEntries=(cookie:string)=>{
    const result=/$\w=\S+(?=;*)/g.exec(cookie);
    if(result){
        return result[0];
    }
    return ''
}