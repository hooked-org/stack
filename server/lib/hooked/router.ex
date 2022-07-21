defmodule Hooked.Router do
  use Plug.Router

  plug(:match)
  plug(Plug.Parsers, parsers: [:json], pass: ["application/json"], json_decoder: Jason)
  plug(:dispatch)

  post "/" do
    case conn.body_params do
      %{"url" => url, "callback" => callback} ->
        conn
        |> handle_extract_auth(fn token, uid -> Hooked.WSConnection.start(url, callback, token, uid) end)
      _ ->
        {:malformed_data, "'url' and 'callback' parameters are required"}
    end
    |> handle_response(conn)
  end

  get "/:cid" do
    case conn.path_params do
      %{"cid" => cid} ->
        conn
        |> handle_extract_auth(fn _, _ -> Hooked.WSConnection.info(cid) end)
      _ ->
        {:malformed_data, "'cid' parameter is required"}
    end
    |> handle_response(conn)
  end

  post "/:cid" do
    case conn.path_params do
      %{"cid" => cid} ->
        conn
        |> handle_extract_auth(fn _, _ -> Hooked.WSConnection.send(cid) end)
      _ ->
        {:malformed_data, "'cid' parameter is required"}
    end
    |> handle_response(conn)
  end

  delete "/:cid" do
    case conn.path_params do
      %{"cid" => cid} ->
        conn
        |> handle_extract_auth(fn _, _ -> Hooked.WSConnection.stop(cid) end)
      _ ->
        {:malformed_data, "'cid' parameter is required"}
    end
    |> handle_response(conn)
  end

  match _ do
    conn
    |> put_resp_header("location", "https://dash.hooked.sh/")
    |> send_resp(302, "https://dash.hooked.sh/")
  end

  defp handle_extract_auth(conn, success_lambda) do
    case conn
         |> get_req_header("authorization")
         |> Hooked.Authentication.validate_bearer_header() do
      {:ok, token, uid} ->
        success_lambda.(token, uid)

      {:error, _} ->
        {:malformed_data, "Missing/Invalid authorization header"}
    end
  end

  defp handle_response(response, conn) do
    %{code: code, message: message, json: json} =
      case response do
        {:ok, data} ->
          %{code: 200, message: Jason.encode!(data), json: true}

        {:not_found, message} ->
          %{code: 404, message: Jason.encode!(%{reason: message}), json: true}

        {:conflict, message} ->
          %{code: 409, message: Jason.encode!(%{reason: message}), json: true}

        {:malformed_data, message} ->
          %{code: 400, message: Jason.encode!(%{reason: message}), json: true}

        {:not_authorized, message} ->
          %{code: 401, message: Jason.encode!(%{reason: message}), json: true}

        {:server_error, _} ->
          %{code: 500, message: Jason.encode!(%{reason: "An error occurred internally"}), json: true}

        _ ->
          %{code: 500, message: Jason.encode!(%{reason: "An error occurred internally"}), json: true}
      end

    case json do
      true ->
        conn
        |> put_resp_header("content-type", "application/json")

      false ->
        conn
    end
    |> send_resp(code, message)
  end
end
