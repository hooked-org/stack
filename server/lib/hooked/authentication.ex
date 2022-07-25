defmodule Hooked.Authentication do
  def validate_bearer_header(header_value_array) when is_list(header_value_array) do
    do_validate_bearer_header(header_value_array)
  end

  # any amount of items left
  defp do_validate_bearer_header([first_item | rest]) do
    case first_item
         |> String.split(" ") do
      ["Bearer", token] ->
        IO.puts "Authentication: validate_bearer_header: token: #{token}"
        case MyXQL.query(:myxql, "SELECT owner,id FROM projects WHERE access_token = ? LIMIT 1", [token]) do
          {:ok, %MyXQL.Result{rows: [[uid,id]]}} ->
            IO.puts "Authentication: validate_bearer_header: uid: #{uid}, id: #{id}"
            {:ok, token, uid, id}
          _ ->
            {:error, :not_found}
        end
      _ ->
        do_validate_bearer_header(rest)
    end
  end

  # no items left
  defp do_validate_bearer_header([]), do: {:error, :not_found}
end
