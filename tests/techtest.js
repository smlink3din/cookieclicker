class TechTestPage {
  constructor(page) {
    this.page = page;
    this.url = 'https://Tom-paine-2022-05-27.cookieclickertechtest.airelogic.com';
  }

  async navigate() {
    await this.page.goto(this.url);
  }
}

module.exports = TechTestPage;