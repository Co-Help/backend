class TokenManager {
  constructor(arr = []) {
    this.data = arr;
  }

  addToken(token) {
    if (!this.data.includes(token)) {
      this.data.push(token);
    }
  }

  removeToken(token) {
    this.data = this.data.filter((item) => item !== token);
  }

  isTokenAvailable(token) {
    return this.data.includes(token) ? true : false;
  }

  log() {
    console.log(this.data);
  }
}

module.exports = TokenManager;
