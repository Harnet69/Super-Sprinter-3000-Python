const puppeteer = require('puppeteer');

/**
 * This is a thin wrapper so that we use a singleton of
 * the browser that puppeteer creates
 */
class Browser {
    setUp(done) {
        const puppeteerOpts = this.options && this.options.puppeteer ?
            this.options.puppeteer :
            {};
        puppeteer.launch(puppeteerOpts).then(async b => {
            this.setBrowser(b);
            done();
        });
    }

    setBrowser(b) {
        this.browser = b;
        const oldNewPage = this.browser.newPage.bind(this.browser);
        this.browser.newPage = async function () {
            const page = await oldNewPage();
            this.lastPage = page;
            return page;
        };
    }

    setOptions(opts) {
        this.options = opts;
    }

    test(promise) {
        return (done) => {
            promise(this.browser, this.options)
                .then(() => done()).catch(done);
        };
    }
}

/*
 * Create a new browser and use a proxy to pass
 * any puppeteer calls to the inner browser
 */
module.exports = new Proxy(new Browser(), {
    get: function (target, name) {
        return name in target ? target[name].bind(target) : target.browser[name];
    }
});
