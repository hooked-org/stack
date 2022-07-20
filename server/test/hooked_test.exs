defmodule HookedTest do
  use ExUnit.Case
  doctest Hooked

  test "greets the world" do
    assert Hooked.hello() == :world
  end
end
