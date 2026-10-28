class APIError(Exception):
    """An error rendered as {"detail": {"status": code, "message": message}}."""

    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message
