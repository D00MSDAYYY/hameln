def f(request, response, user_sessions_storage):
    session_id = request.cookies.get("session_id")
    if session_id:
        user_sessions_storage.delete_session(session_id)
    response.delete_cookie("session_id")
    return {"message": "Вы вышли"}
