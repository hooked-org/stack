defmodule Hooked.WSConnection do
  use WebSockex, restart: :temporary

  def start_link([url, state, cid]) do
    IO.puts "WSConnection: start_link: #{url}, #{state}, #{cid}"
    WebSockex.start_link(url, __MODULE__, state, name: via_tuple(cid), handle_initial_conn_failure: true)
  end

  # registry lookup handler
  defp via_tuple(cid), do: {:via, Registry, {:ws_registry, cid}}

  def handle_frame({:text, msg}, state) do
    usage = Hooked.UsageTracker.increment(:received, state.token)
    if usage.received + usage.sent < usage.tier do
      Finch.build(:post, state.callback, [], msg) |> Finch.request(:callback_finch)
    end
    {:ok, state}
  end

  def handle_cast({:send, frame}, state) do
    Hooked.UsageTracker.increment(:sent, state.token) |> inspect |> IO.puts
    {:reply, frame, state}
  end

  def handle_disconnect(_, state) do
    IO.puts "WSConnection: handle_disconnect: #{state.token}"
    :timer.sleep(15000)
    {:reconnect, state}
  end

  def handle_info(:close_socket, {t_ref, state}) do
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

  def start(url, callback, token, uid, project) do
    IO.puts "WSConnection: start: #{url}, #{callback}, #{token}, #{uid}, #{project}"
    cid = Base.encode16(:crypto.hash(:sha256, "#{url}#{callback}#{token}"))
    child_spec = {Hooked.WSConnection, [url, %{uid: uid, token: token, callback: callback, project: project}, cid]}

    case DynamicSupervisor.start_child(Hooked.WSSupervisor, child_spec) do
      {:ok, _pid} ->
        {:ok, %{id: cid}}

      {:error, _} ->
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
    with {:ok, _} <- not_nil(whereis(cid), {:not_found, "This connection does not exist."}) do
      {:ok, %{cid: cid}}
    else
      {:error, reason} -> reason
    end
  end

  def send_text(client, message) do
    WebSockex.send_frame(client, {:text, message})
  end

  def send(token, cid, message) do
    with {:ok, pid} <- not_nil(whereis(cid), {:not_found, "This connection does not exist."}) do
      usage = Hooked.UsageTracker.increment(:sent, token)
      if usage.received + usage.sent < usage.tier do
        Hooked.WSConnection.send_text(pid, message)
        {:ok, %{}}
      else
        {:not_authorized, "usage quota exceeded"}
      end
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
