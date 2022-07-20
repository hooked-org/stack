defmodule Hooked.Authentication do
  def validate_bearer_header(header_value_array) when is_list(header_value_array) do
    do_validate_bearer_header(header_value_array)
  end

  # any amount of items left
  defp do_validate_bearer_header([first_item | rest]) do
    case first_item
         |> String.split(" ") do
      ["Bearer", token] ->
        {:ok, uid} = Redix.command(:redix, ["GET", "bearer:#{token}"])
        if uid == nil do
          # {:error, :not_found}
          {:ok, token, "none"}
        else
          {:ok, token, uid}
        end

      _ ->
        do_validate_bearer_header(rest)
    end
  end

  # no items left
  defp do_validate_bearer_header([]), do: {:error, :not_found}
end
