class Response {
  constructor(req, res) {
    this.req = req;
    this.res = res;
  }

  handle(data, code = 200, messages = ["Request Completed Successfully"], trace = null) {
    let response = {
      code,
      messages,
      data
    };

    if (code >= 200 && data) {
      response = {
        code,
        messages,
        data: data
      };
    }

    if (code == 406 || code == 401 || code >= 400) {
      const jsonResponse = {
        error: {
          code,
          messages,
          data,
          trace
        }
      };
      this.res.status(code).json(jsonResponse);
      return;
    }

    const jsonResponse = {
      response
    };
    this.res.status(code).json(jsonResponse);
  }
}

export default Response;
