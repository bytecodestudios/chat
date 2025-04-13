RegisterNetEvent("chat:addMessage")
RegisterNetEvent("chat:addSuggestion")
RegisterNetEvent("chat:addSuggestions")
RegisterNetEvent("chat:removeSuggestion")
RegisterNetEvent("chat:clear")

-- internal events
RegisterNetEvent("__cfx_internal:serverPrint")

RegisterNetEvent("_chat:messageEntered")

local isControlsDisabled = false

local function disableControls()
	isControlsDisabled = true
	CreateThread(function()
		while isControlsDisabled do
			Wait(4)
			DisablePlayerFiring(PlayerId(), true)
			DisableControlAction(0, 0, true)
			DisableControlAction(0, 1, true)
			DisableControlAction(0, 2, true)
			DisableControlAction(0, 3, true)
			DisableControlAction(0, 4, true)
			DisableControlAction(0, 45, true)
			DisableControlAction(0, 199, true)
			DisableControlAction(0, 200, true)
		end
	end)
end

-- addMessage
local addMessage = function(data)
	if type(data) == "string" then
		data = {
			args = { data }
		}
	end

	SendNUIMessage(
		{
			type = "ON_MESSAGE",
			message = data
		}
	)
end

exports("addMessage", addMessage)
AddEventHandler("chat:addMessage", addMessage)

-- addSuggestion
local addSuggestion = function(name, help, params)
	SendNUIMessage(
		{
			type = "ON_SUGGESTION_ADD",
			suggestion = {
				name = name,
				help = help,
				params = params or nil
			}
		}
	)
end

exports("addSuggestion", addSuggestion)
AddEventHandler("chat:addSuggestion", addSuggestion)

AddEventHandler("chat:addSuggestions", function(suggestions)
	for _, suggestion in ipairs(suggestions) do
		SendNUIMessage(
			{
				type = "ON_SUGGESTION_ADD",
				suggestion = suggestion
			}
		)
	end
end)

AddEventHandler("chat:removeSuggestion", function(name)
	SendNUIMessage(
		{
			type = "ON_SUGGESTION_REMOVE",
			name = name
		}
	)
end)

AddEventHandler("chat:clear", function()
	SendNUIMessage(
		{
			type = "ON_CLEAR"
		}
	)
end)

RegisterNUICallback("isTyping", function(data, cb)
	SetNuiFocusKeepInput(not data.isTyping)
	cb("ok")
end)

RegisterNUICallback("chatResult", function(data, cb)
	isControlsDisabled = false
	if data.message:sub(1, 1) == "/" then
		ExecuteCommand(data.message:sub(2))
	else
		ExecuteCommand(data.message:sub(1))
	end
	cb("ok")
end)

RegisterNUICallback("closeChat", function(_, cb)
	isControlsDisabled = false
	SetNuiFocus(false, false)
	cb("ok")
end)

local function refreshCommands()
	if GetRegisteredCommands then
		local registeredCommands = GetRegisteredCommands()

		local suggestions = {}

		for _, command in ipairs(registeredCommands) do
			if IsAceAllowed(("command.%s"):format(command.name)) and command.name ~= "+openchat" then
				table.insert(suggestions, { name = "/" .. command.name, help = "" })
			end
		end

		TriggerEvent("chat:addSuggestions", suggestions)
	end
end

AddEventHandler("onClientResourceStart",function(resName)
	Wait(500)
	refreshCommands()
end)

AddEventHandler("onClientResourceStop", function(resName)
	Wait(500)
	refreshCommands()
end)

CreateThread(function()
	SetTextChatEnabled(false)
	RegisterKeyMapping("+openchat", "Open Chat", "KEYBOARD", "T")
	RegisterCommand( "+openchat", function(source, args, raw)
		if IsNuiFocused() then return end
		disableControls()
		SetNuiFocus(true, true)
		SendNUIMessage({type = "ON_OPEN"})
	end, false)
end)
