defmodule Hooked.WSConnection do
  use WebSockex, restart: :temporary

  def start_link([url, state, cid]) do
    WebSockex.start_link(url, __MODULE__, state, name: via_tuple(cid), handle_initial_conn_failure: true)
  end

  # registry lookup handler
  defp via_tuple(cid), do: {:via, Registry, {:ws_registry, cid}}

  def handle_frame({:text, msg}, state) do
    #Redix.command(:redix, ["INCR", "usage:#{state.uid}:#{state.project}:#{DateTime.utc_now.month}"])
    period = (DateTime.utc_now.year * 100) + DateTime.utc_now.month
    MyXQL.query(:myxql, "INSERT INTO usage (id, user, period, project, received, sent) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE received = received + 1;", ["#{state.uid}_#{state.project}_#{period}", state.uid, period, state.project, 1, 0])
    Finch.build(:post, state.callback, [], msg) |> Finch.request(:callback_finch)
    {:ok, state}
  end

  def handle_cast({:send, frame}, state) do
    # Redix.command(:redix, ["INCR", "usage:#{state.uid}:#{DateTime.utc_now.month}"])
    period = (DateTime.utc_now.year * 100) + DateTime.utc_now.month
    MyXQL.query(:myxql, "INSERT INTO usage (id, user, period, project, received, sent) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE sent = sent + 1;", ["#{state.uid}_#{state.project}_#{period}", state.uid, period, state.project, 0, 1])
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

  def handle_call(req, from, state) do
    IO.puts("called")
    IO.puts(inspect req)
    IO.puts(inspect state)
    {:reply, req, state}
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

  def start(url, callback, token, uid, project) do
    cid = Base.encode16(:crypto.hash(:sha256, "#{url}#{callback}#{token}"))
    child_spec = {Hooked.WSConnection, [url, %{uid: uid, callback: callback, project: project}, cid]}

    case DynamicSupervisor.start_child(Hooked.WSSupervisor, child_spec) do
      {:ok, _pid} ->
        {:ok, %{id: cid}}

      {:error, reason} ->
        {:error, "Failed to start connection."}
    end
  end

  def stop(cid) do
    with {:ok, pid} <- not_nil(whereis(cid), {:not_found, "This connection does not exist."}) do
      Process.exit(pid, :kill)
      {:ok, %{}}
    else
      {:error, reason} -> reason
    end
  end

  def info(cid) do
    with {:ok, pid} <- not_nil(whereis(cid), {:not_found, "This connection does not exist."}) do
      {:ok, %{cid: cid}}
    else
      {:error, reason} -> reason
    end
  end

  @spec send_text(pid, String.t) :: :ok
  def send_text(client, message) do
    WebSockex.send_frame(client, {:text, message})
  end

  def send(cid, message) do
    with {:ok, pid} <- not_nil(whereis(cid), {:not_found, "This connection does not exist."}) do
      Hooked.WSConnection.send_text(pid, message)
      {:ok, %{}}
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
