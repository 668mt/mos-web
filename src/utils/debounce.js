export default (() => {
    let timer = null;
    return (callback, wait) => {
        clearTimeout(timer);
        timer = setTimeout(callback, wait);
    }
})()