defmodule Hooked.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {Bandit, scheme: :http, plug: Hooked.Router, options: [port: 8080]},
      {Redix, host: "0.0.0.0", port: 56379, name: :redix},
      {Registry, keys: :unique, name: :ws_registry},
      {Finch, name: :callback_finch},
      {DynamicSupervisor, strategy: :one_for_one, name: Hooked.WSSupervisor}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Hooked.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
