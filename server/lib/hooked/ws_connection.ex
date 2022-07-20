defmodule Hooked.WSConnection do
  use WebSockex, restart: :temporary

  def start_link([url, state, cid]) do
    WebSockex.start_link(url, __MODULE__, state, name: via_tuple(cid), handle_initial_conn_failure: true)
  end

  # registry lookup handler
  defp via_tuple(cid), do: {:via, Registry, {:ws_registry, cid}}

  def handle_frame({:text, msg}, state) do
    Redix.command(:redix, ["INCR", "usage:#{state.uid}:#{DateTime.utc_now.month}"])
    Finch.build(:post, state.callback, [], msg) |> Finch.request(:callback_finch)
    {:ok, state}
  end

  def handle_cast({:send, frame}, state) do
    Redix.command(:redix, ["INCR", "usage:#{state.uid}:#{DateTime.utc_now.month}"])
    {:reply, frame, state}
  end

  def handle_disconnect(_, state) do
    IO.puts("dc")
    :timer.sleep(15000)
    {:reconnect, state}
  end

  def handle_info(:close_socket, {t_ref, state}) do
    IO.puts("close socket")
    :timer.cancel(t_ref)
    {:close, {nil, state}}
  end

  defp not_nil(val, reason) do
    if val != nil and val != "" do
      {:ok, val}
    else
      {:error, reason}
    end
  end

  defp expect_nil(val, reason) do
    if val != nil do
      {:error, reason}
    else
      {:ok, val}
    end
  end

  def start_child(spec) do
    {status, _} = DynamicSupervisor.start_child(Hooked.WSSupervisor, spec)
    if status == :ok do
      {:ok}
    else
      {:server_error, "Failed to connect"}
    end
  end

  def start(conn, token, uid) do
    with {:ok, url}      <- not_nil(Map.get(conn.body_params, "url"), {:malformed_data, "'url' needs to be provided in the JSON encoded body."}),
         {:ok, callback} <- not_nil(Map.get(conn.body_params, "callback"), {:malformed_data, "'callback' needs to be provided in the JSON encoded body."}),
         cid             <- Base.encode16(:crypto.hash(:sha256, "#{url}#{callback}#{token}")),
         {:ok, _}        <- expect_nil(whereis(cid), {:conflict, "Connection between this websocket and callback is already open."}),
         spec            <- {Hooked.WSConnection, [url, %{uid: uid, callback: callback}, cid]},
         {:ok}           <- start_child(spec) do
        {:ok, %{cid: cid}}
      else
        {:error, reason} -> reason
      end
  end

  def stop(conn) do
    with {:ok, cid} <- not_nil(Map.get(conn.path_params, "cid"), {:malformed_data, "'cid' is not specified in the url. Expected '/:cid'"}),
         {:ok, pid} <- not_nil(whereis(cid), {:not_found, "This connection does not exist."}) do
      Process.exit(pid, :kill)
      {:ok, %{}}
    else
      {:error, reason} -> reason
    end
  end

  def info(conn) do
    with {:ok, cid} <- not_nil(Map.get(conn.path_params, "cid"), {:malformed_data, "'cid' is not specified in the url. Expected '/:cid'"}),
         {:ok, pid} <- not_nil(whereis(cid), {:not_found, "This connection does not exist."}) do
      {:ok, %{cid: cid}}
    else
      {:error, reason} -> reason
    end
  end

  def send(conn) do
    with {:ok, cid} <- not_nil(Map.get(conn.path_params, "cid"), {:malformed_data, "'cid' is not specified in the url. Expected '/:cid'"}),
         {:ok, pid} <- not_nil(whereis(cid), {:not_found, "This connection does not exist."}) do
      {:not_authorized, "TODO: Not Implemented Yet"}
    else
      {:error, reason} -> reason
    end
  end

  def whereis(cid) do
    case Registry.lookup(:ws_registry, cid) do
      [{pid, _}] -> pid
      [] -> nil
    end
  end
end
