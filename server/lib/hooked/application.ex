defmodule Hooked.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {Bandit, scheme: :http, plug: Hooked.Router, options: [port: 8080]},
      {Registry, keys: :unique, name: :ws_registry},
      {Registry, keys: :unique, name: :usage_registry},
      {Finch, name: :callback_finch},
      {
        MyXQL,
        username: System.get_env("DB_USERNAME"),
        password: System.get_env("DB_PASSWORD"),
        hostname: System.get_env("DB_HOST"),
        database: System.get_env("DB_DATABASE"),
        ssl: true,
        name: :myxql
      },
      {DynamicSupervisor, strategy: :one_for_one, name: Hooked.WSSupervisor},
      {DynamicSupervisor, strategy: :one_for_one, name: Hooked.UsageSupervisor}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Hooked.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
