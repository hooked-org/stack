defmodule Hooked.MixProject do
  use Mix.Project

  def project do
    [
      app: :hooked,
      version: "0.1.0",
      elixir: "~> 1.13",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger],
      mod: {Hooked.Application, []}
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:websockex, "~> 0.4.3"},
      {:redix, "~> 1.1"},
      {:bandit, ">= 0.5.0"},
      {:jason, "~> 1.3"},
      {:finch, "~> 0.12"}
    ]
  end
end
