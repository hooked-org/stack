defmodule Hooked.Router do
  use Plug.Router

  plug(:match)
  plug(Plug.Parsers, parsers: [:json], pass: ["application/json"], json_decoder: Jason)
  plug(:dispatch)

  # get "/" do
  #   conn
  #   |> handle_extract_auth(fn (token) ->
  #     {:ok, pong} = Redix.command(:redix, ["PING"])
  #     {:ok, %{pong: pong}}
  #   end)
  #   |> handle_response(conn)
  # end

  post "/" do
    conn
    |> handle_extract_auth(&Hooked.WSConnection.start(conn, &1, &2))
    |> handle_response(conn)
  end

  get "/:cid" do
    conn
    |> handle_extract_auth(fn _, _ -> Hooked.WSConnection.info(conn) end)
    |> handle_response(conn)
  end

  post "/:cid" do
    conn
    |> handle_extract_auth(fn _, _ -> Hooked.WSConnection.send(conn) end)
    |> handle_response(conn)
  end

  delete "/:cid" do
    conn
    |> handle_extract_auth(fn _, _ -> Hooked.WSConnection.stop(conn) end)
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
