export default class Lock {
    constructor() {
        this.state = false;
    }

    doWithLock(resolve) {
        if (this.state) {
            setTimeout(() => this.doWithLock(resolve), 100);
        } else {
            this.state = true;
            let rs = resolve();
            this.state = false;
            return rs;
        }
    }
}