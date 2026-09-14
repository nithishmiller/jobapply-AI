from fastapi.responses import JSONResponse


def success_response(data=None, message="Success", status_code=200):
    """Standard success envelope.

    Returns a plain dict for the default 200 (lets FastAPI infer 200),
    or a JSONResponse carrying the requested status code for 201/202 etc.
    """
    content = {"status": "success", "message": message}
    if data is not None:
        content["data"] = data
    if status_code != 200:
        return JSONResponse(status_code=status_code, content=content)
    return content


def error_response(message="Error", status_code=400):
    return JSONResponse(status_code=status_code, content={"status": "error", "message": message})
