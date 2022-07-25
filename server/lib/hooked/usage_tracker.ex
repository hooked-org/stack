defmodule Hooked.UsageTracker do
  use GenServer

  defmodule State do
    defstruct uid: 0, project: 0, tier: 0, access_token: "", sent: 0, d_sent: 0, received: 0, d_received: 0, needs_update: false
  end

  def start_link(access_token) do
    IO.puts "UsageTracker: start_link: #{access_token}"
    GenServer.start_link(__MODULE__, access_token, name: via_tuple(access_token))
  end

  def init(access_token) do
    IO.puts "UsageTracker: init: #{access_token}"
    state = %State{access_token: access_token}
    period = (DateTime.utc_now.year * 100) + DateTime.utc_now.month

    schedule_sync()

    case MyXQL.query(:myxql, """
      SELECT
          projects.owner,
          projects.id,
          IFNULL(SUM(usage.sent), 0) as sent,
          IFNULL(SUM(usage.received), 0) as received,
          users.tier as tier
        FROM projects
        LEFT OUTER JOIN usage
            ON projects.owner = usage.user AND usage.period = ?
        LEFT OUTER JOIN users
            ON projects.owner = users.id
        WHERE access_token = ?
        GROUP BY projects.id, projects.owner
        LIMIT 1
    """, [period, access_token]) do
      {:ok, %MyXQL.Result{rows: [[uid, project, sent, received, tier]]}} ->
        IO.puts "UsageTracker: init: uid: #{uid}, project: #{project}, sent: #{sent}, received: #{received}, tier: #{tier}"
        {
          :ok,
          state
          |> Map.put(:uid, uid)
          |> Map.put(:project, project)
          |> Map.put(:sent, sent |> Decimal.round() |> Decimal.to_integer())
          |> Map.put(:received, received |> Decimal.round() |> Decimal.to_integer())
          |> Map.put(:tier, tier)
        }
      _ ->
        {:error, :not_found}
    end
  end

  def handle_call(:sent, _from, state) do
    state = state
      |> Map.put(:sent, state.sent + 1)
      |> Map.put(:d_sent, state.d_sent + 1)
      |> Map.put(:needs_update, true)
    {
      :reply,
      %{sent: state.sent, received: state.received, tier: state.tier},
      state
    }
  end

  def handle_call(:received, _from, state) do
    state = state
      |> Map.put(:received, state.received + 1)
      |> Map.put(:d_received, state.d_received + 1)
      |> Map.put(:needs_update, true)
    {
      :reply,
      %{sent: state.sent, received: state.received, tier: state.tier},
      state
    }
  end

  def handle_info(:sync, state) do
    period = (DateTime.utc_now.year * 100) + DateTime.utc_now.month

    schedule_sync()

    MyXQL.query(:myxql, """
      INSERT INTO usage (id, user, period, project, received, sent)
        VALUES (?,?,?,?,?,?)
        ON DUPLICATE KEY
        UPDATE received = received + ?, sent = sent + ?;
    """, [
      "#{state.uid}_#{state.project}_#{period}",
      state.uid,
      period,
      state.project,
      state.received,
      state.sent,
      state.d_received,
      state.d_sent,
    ])


    case MyXQL.query(:myxql, """
      SELECT users.tier
        FROM projects
        LEFT OUTER JOIN users
          ON projects.owner = users.id
        WHERE access_token = ?;
    """, [state.access_token]) do
      {:ok, %MyXQL.Result{rows: [[tier]]}} ->
        {
          :noreply,
          state
          |> Map.put(:d_sent, 0)
          |> Map.put(:d_received, 0)
          |> Map.put(:needs_update, false)
          |> Map.put(:tier, tier)
        }
      _ ->
        {:noreply, state}
    end
  end

  defp schedule_sync() do
    Process.send_after(self(), :sync, 30 * 1000) # Every 30 seconds
  end

  defp not_nil(val, reason) do
    if val != nil and val != "" do
      {:ok, val}
    else
      {:error, reason}
    end
  end

  def increment(direction, access_token) do
    case not_nil(whereis(access_token), {:not_found, "This connection does not exist."}) do
      {:ok, pid} ->
        GenServer.call(pid, direction)
      _ ->
        child_spec = {Hooked.UsageTracker, access_token}
        case DynamicSupervisor.start_child(Hooked.UsageSupervisor, child_spec) do
          {:ok, pid} ->
            GenServer.call(pid, direction)

          {:error, _} ->
            {:error, "Failed to start connection."}
        end
      end
  end

  def whereis(access_token) do
    case Registry.lookup(:usage_registry, access_token) do
      [{pid, _}] -> pid
      [] -> nil
    end
  end

  defp via_tuple(cid), do: {:via, Registry, {:usage_registry, cid}}
end
