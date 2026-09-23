extends Node3D

const PLAYER_SCRIPT := preload("res://scripts/player.gd")
const JOYSTICK_SCRIPT := preload("res://scripts/mobile_joystick.gd")
const LOOK_SCRIPT := preload("res://scripts/touch_look.gd")

var player: CharacterBody3D
var joystick
var touch_look
var camera: Camera3D

const CITY_SIZE := 180.0
const ROAD_WIDTH := 12.0
const BLOCK_SIZE := 28.0

var building_materials: Array[StandardMaterial3D] = []


func _ready() -> void:
	_setup_lighting()
	_setup_city()
	_setup_player()
	_setup_mobile_ui()


func _setup_lighting() -> void:
	var world_environment := WorldEnvironment.new()
	var environment := Environment.new()

	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("#72b7df")
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("#d5e7ff")
	environment.ambient_light_energy = 0.75
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC

	world_environment.environment = environment
	add_child(world_environment)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-55.0, -35.0, 0.0)
	sun.light_energy = 1.1
	sun.shadow_enabled = true
	add_child(sun)


func _setup_city() -> void:
	var ground := StaticBody3D.new()
	ground.name = "Ground"
	add_child(ground)

	var ground_mesh := MeshInstance3D.new()
	var ground_box := BoxMesh.new()
	ground_box.size = Vector3(CITY_SIZE, 0.2, CITY_SIZE)
	ground_mesh.mesh = ground_box
	ground_mesh.position.y = -0.1

	var ground_material := StandardMaterial3D.new()
	ground_material.albedo_color = Color("#30343b")
	ground_material.roughness = 0.95
	ground_mesh.material_override = ground_material
	ground.add_child(ground_mesh)

	var ground_collision := CollisionShape3D.new()
	var ground_shape := BoxShape3D.new()
	ground_shape.size = Vector3(CITY_SIZE, 0.2, CITY_SIZE)
	ground_collision.shape = ground_shape
	ground_collision.position.y = -0.1
	ground.add_child(ground_collision)

	_create_materials()
	_create_roads()
	_create_buildings()
	_create_trees()


func _create_materials() -> void:
	var colors := [
		Color("#d96b72"),
		Color("#56b8b0"),
		Color("#f1c75b"),
		Color("#8bbbd1"),
		Color("#aa91d4"),
		Color("#e58fba"),
		Color("#79bd91"),
		Color("#edaa76")
	]

	for color in colors:
		var material := StandardMaterial3D.new()
		material.albedo_color = color
		material.roughness = 0.8
		building_materials.append(material)


func _create_roads() -> void:
	var road_material := StandardMaterial3D.new()
	road_material.albedo_color = Color("#202328")
	road_material.roughness = 0.95

	var road_count := int(CITY_SIZE / (BLOCK_SIZE + ROAD_WIDTH))

	for i in range(-road_count, road_count + 1):
		var position := float(i) * (BLOCK_SIZE + ROAD_WIDTH)

		_create_box(
			Vector3(CITY_SIZE, 0.05, ROAD_WIDTH),
			Vector3(0.0, 0.03, position),
			road_material,
			false
		)

		_create_box(
			Vector3(ROAD_WIDTH, 0.05, CITY_SIZE),
			Vector3(position, 0.04, 0.0),
			road_material,
			false
		)


func _create_buildings() -> void:
	var block_count := int(CITY_SIZE / (BLOCK_SIZE + ROAD_WIDTH))

	for x in range(-block_count, block_count + 1):
		for z in range(-block_count, block_count + 1):
			var block_x := float(x) * (BLOCK_SIZE + ROAD_WIDTH)
			var block_z := float(z) * (BLOCK_SIZE + ROAD_WIDTH)

			if abs(block_x) > CITY_SIZE * 0.45:
				continue
			if abs(block_z) > CITY_SIZE * 0.45:
				continue

			# Keep the starting area clear.
			if Vector2(block_x, block_z).length() < 22.0:
				continue

			var building_count := 1 + randi_range(0, 2)

			for i in range(building_count):
				var width := randf_range(8.0, 14.0)
				var depth := randf_range(8.0, 14.0)
				var height := randf_range(8.0, 30.0)

				var px := block_x + randf_range(-BLOCK_SIZE * 0.25, BLOCK_SIZE * 0.25)
				var pz := block_z + randf_range(-BLOCK_SIZE * 0.25, BLOCK_SIZE * 0.25)

				var material := building_materials.pick_random()

				_create_building(
					Vector3(px, height * 0.5, pz),
					Vector3(width, height, depth),
					material
				)


func _create_building(
	position: Vector3,
	size: Vector3,
	material: StandardMaterial3D
) -> void:
	var body := StaticBody3D.new()
	body.position = position
	add_child(body)

	var mesh := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = size
	mesh.mesh = box
	mesh.material_override = material
	mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	body.add_child(mesh)

	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)


func _create_trees() -> void:
	var trunk_material := StandardMaterial3D.new()
	trunk_material.albedo_color = Color("#74452d")

	var leaf_material := StandardMaterial3D.new()
	leaf_material.albedo_color = Color("#2c914d")

	for i in range(35):
		var x := randf_range(-CITY_SIZE * 0.42, CITY_SIZE * 0.42)
		var z := randf_range(-CITY_SIZE * 0.42, CITY_SIZE * 0.42)

		# Avoid roads.
		var x_on_road := fmod(abs(x), BLOCK_SIZE + ROAD_WIDTH) < ROAD_WIDTH
		var z_on_road := fmod(abs(z), BLOCK_SIZE + ROAD_WIDTH) < ROAD_WIDTH

		if x_on_road or z_on_road:
			continue

		var tree := Node3D.new()
		tree.position = Vector3(x, 0.0, z)
		add_child(tree)

		var trunk := MeshInstance3D.new()
		var trunk_mesh := CylinderMesh.new()
		trunk_mesh.top_radius = 0.22
		trunk_mesh.bottom_radius = 0.32
		trunk_mesh.height = 2.2
		trunk.mesh = trunk_mesh
		trunk.material_override = trunk_material
		trunk.position.y = 1.1
		tree.add_child(trunk)

		var leaves := MeshInstance3D.new()
		var leaves_mesh := SphereMesh.new()
		leaves_mesh.radius = 1.25
		leaves_mesh.height = 2.2
		leaves.mesh = leaves_mesh
		leaves.material_override = leaf_material
		leaves.position.y = 2.6
		tree.add_child(leaves)


func _create_box(
	size: Vector3,
	position: Vector3,
	material: StandardMaterial3D,
	collision_enabled: bool
) -> Node3D:
	var object := Node3D.new()
	object.position = position
	add_child(object)

	var mesh := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = size
	mesh.mesh = box
	mesh.material_override = material
	object.add_child(mesh)

	if collision_enabled:
		var body := StaticBody3D.new()
		object.add_child(body)

	return object


func _setup_player() -> void:
	player = CharacterBody3D.new()
	player.name = "Player"
	player.position = Vector3(0.0, 1.0, 0.0)
	player.set_script(PLAYER_SCRIPT)
	add_child(player)

	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.45
	capsule.height = 1.8
	collision.shape = capsule
	collision.position.y = 0.9
	player.add_child(collision)

	var body_mesh := MeshInstance3D.new()
	var capsule_mesh := CapsuleMesh.new()
	capsule_mesh.radius = 0.45
	capsule_mesh.height = 1.8
	body_mesh.mesh = capsule_mesh
	body_mesh.position.y = 0.9

	var body_material := StandardMaterial3D.new()
	body_material.albedo_color = Color("#3e78d1")
	body_mesh.material_override = body_material
	player.add_child(body_mesh)

	var camera_pivot := Node3D.new()
	camera_pivot.name = "CameraPivot"
	camera_pivot.position = Vector3(0.0, 1.4, 0.0)
	player.add_child(camera_pivot)

	camera = Camera3D.new()
	camera.name = "ThirdPersonCamera"
	camera.position = Vector3(0.0, 1.0, 5.5)
	camera.rotation_degrees = Vector3(-10.0, 180.0, 0.0)
	camera.current = true
	camera.fov = 68.0
	camera_pivot.add_child(camera)

	player.camera_pivot = camera_pivot
	player.camera = camera


func _setup_mobile_ui() -> void:
	var canvas := CanvasLayer.new()
	canvas.name = "MobileHUD"
	add_child(canvas)

	joystick = Control.new()
	joystick.name = "Joystick"
	joystick.set_script(JOYSTICK_SCRIPT)
	joystick.position = Vector2(55.0, 520.0)
	joystick.size = Vector2(170.0, 170.0)
	canvas.add_child(joystick)

	touch_look = Control.new()
	touch_look.name = "TouchLook"
	touch_look.set_script(LOOK_SCRIPT)
	touch_look.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	canvas.add_child(touch_look)

	var jump_button := Button.new()
	jump_button.text = "JUMP"
	jump_button.position = Vector2(1100.0, 560.0)
	jump_button.size = Vector2(120.0, 70.0)
	jump_button.pressed.connect(_on_jump_pressed)
	canvas.add_child(jump_button)

	var sprint_button := Button.new()
	sprint_button.text = "SPRINT"
	sprint_button.position = Vector2(950.0, 640.0)
	sprint_button.size = Vector2(120.0, 70.0)
	sprint_button.button_down.connect(_on_sprint_down)
	sprint_button.button_up.connect(_on_sprint_up)
	canvas.add_child(sprint_button)

	joystick.direction_changed.connect(_on_joystick_changed)
	touch_look.look_changed.connect(_on_look_changed)


func _on_joystick_changed(direction: Vector2) -> void:
	if is_instance_valid(player):
		player.set_move_input(direction)


func _on_look_changed(delta: Vector2) -> void:
	if is_instance_valid(player):
		player.rotate_camera(delta)


func _on_jump_pressed() -> void:
	if is_instance_valid(player):
		player.jump()


func _on_sprint_down() -> void:
	if is_instance_valid(player):
		player.sprint_pressed = true


func _on_sprint_up() -> void:
	if is_instance_valid(player):
		player.sprint_pressed = false
