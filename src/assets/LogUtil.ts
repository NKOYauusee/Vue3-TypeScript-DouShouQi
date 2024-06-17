function logValInfo(
    info: string = "CUR VAR INFO",
    data: any,
    fn: Function = () => {
    }
): void {
    console.log(" >>>>>>>>>> ")
    console.log(info)
    try {
        console.log(data)
    } catch (e) {
        console.log("ERROR")
        console.error(e)
        fn();
    }
    console.log(" <<<<<<<<<< ")
}

export {
    logValInfo,
}