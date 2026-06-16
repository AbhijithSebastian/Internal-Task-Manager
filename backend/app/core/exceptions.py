from fastapi import HTTPException, status


class BusinessException(HTTPException):
    def __init__(self, message: str, status_code: int = status.HTTP_422_UNPROCESSABLE_ENTITY):
        super().__init__(status_code=status_code, detail=message)


class NotFoundException(HTTPException):
    def __init__(self, entity: str = "Resource", entity_id: int | None = None):
        message = f"{entity} with ID {entity_id} not found." if entity_id else f"{entity} not found."
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=message)


class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenError(HTTPException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ValidationError(HTTPException):
    def __init__(self, message: str, errors: dict | None = None):
        detail = {"message": message, "errors": errors or {}}
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)
