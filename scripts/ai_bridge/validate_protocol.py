#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZhongWenHub AI Collaboration Bridge — Protocol Validator
Pure-Python Draft-07 JSON Schema validator with zero external dependencies.
Validates tasks, results, reviews, checkpoints, evidence, and release gates.
"""

import os
import re
import json
from datetime import datetime
from typing import Dict, Any, List, Tuple


class SchemaValidationError(Exception):
    """Raised when data fails schema validation."""
    pass


class ProtocolValidator:
    """Validates JSON objects against JSON schemas without external libraries."""

    def __init__(self, schemas_dir: str = None):
        if schemas_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.schemas_dir = os.path.join(base_dir, ".ai-collaboration", "protocol")
        else:
            self.schemas_dir = schemas_dir
        self.schemas: Dict[str, dict] = {}
        self._load_schemas()

    def _load_schemas(self):
        schema_map = {
            "task": "task.schema.json",
            "result": "result.schema.json",
            "review": "review.schema.json",
            "checkpoint": "checkpoint.schema.json",
            "qa-evidence": "qa-evidence.schema.json",
            "release-gate": "release-gate.schema.json",
        }
        for name, filename in schema_map.items():
            path = os.path.join(self.schemas_dir, filename)
            if os.path.isfile(path):
                with open(path, "r", encoding="utf-8") as f:
                    self.schemas[name] = json.load(f)

    def validate(self, schema_name: str, instance: dict) -> Tuple[bool, List[str]]:
        """
        Validates an instance against a named schema.
        Returns (is_valid, list_of_errors).
        """
        if schema_name not in self.schemas:
            return False, [f"Schema '{schema_name}' not found in {self.schemas_dir}"]

        schema = self.schemas[schema_name]
        errors: List[str] = []
        self._validate_node(schema, instance, path="$", errors=errors)
        return len(errors) == 0, errors

    def _validate_node(self, schema: dict, value: Any, path: str, errors: List[str]):
        # 1. Type validation
        expected_type = schema.get("type")
        if expected_type:
            if not self._check_type(expected_type, value):
                errors.append(f"{path}: expected type {expected_type}, got {type(value).__name__}")
                return  # Stop deeper validation if basic type fails

        # If value is null and type allowed null, skip rest
        if value is None:
            return

        # 2. Enum check
        if "enum" in schema:
            if value not in schema["enum"]:
                errors.append(f"{path}: value '{value}' is not one of {schema['enum']}")

        # 3. String constraints
        if isinstance(value, str):
            if "minLength" in schema and len(value) < schema["minLength"]:
                errors.append(f"{path}: string length {len(value)} is less than minLength {schema['minLength']}")
            if "maxLength" in schema and len(value) > schema["maxLength"]:
                errors.append(f"{path}: string length {len(value)} is greater than maxLength {schema['maxLength']}")
            if "pattern" in schema:
                pattern = schema["pattern"]
                if not re.search(pattern, value):
                    errors.append(f"{path}: value '{value}' does not match pattern '{pattern}'")
            if schema.get("format") == "date-time":
                if not self._is_valid_iso_datetime(value):
                    errors.append(f"{path}: value '{value}' is not a valid ISO-8601 date-time string")

        # 4. Number constraints
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            if "minimum" in schema and value < schema["minimum"]:
                errors.append(f"{path}: value {value} is less than minimum {schema['minimum']}")
            if "maximum" in schema and value > schema["maximum"]:
                errors.append(f"{path}: value {value} is greater than maximum {schema['maximum']}")

        # 5. Array constraints
        if isinstance(value, list):
            if "minItems" in schema and len(value) < schema["minItems"]:
                errors.append(f"{path}: array has {len(value)} items, minItems is {schema['minItems']}")
            item_schema = schema.get("items")
            if item_schema:
                for idx, item in enumerate(value):
                    self._validate_node(item_schema, item, f"{path}[{idx}]", errors)

        # 6. Object constraints
        if isinstance(value, dict):
            # Check required fields
            required_fields = schema.get("required", [])
            for field in required_fields:
                if field not in value:
                    errors.append(f"{path}: missing required property '{field}'")

            # Check properties
            props = schema.get("properties", {})
            additional_allowed = schema.get("additionalProperties", True)

            for key, val in value.items():
                if key in props:
                    self._validate_node(props[key], val, f"{path}.{key}", errors)
                elif additional_allowed is False:
                    errors.append(f"{path}: unexpected property '{key}' (additionalProperties is false)")
                elif isinstance(additional_allowed, dict):
                    self._validate_node(additional_allowed, val, f"{path}.{key}", errors)

    def _check_type(self, expected_type: Any, value: Any) -> bool:
        if isinstance(expected_type, list):
            return any(self._check_type(t, value) for t in expected_type)

        if expected_type == "null":
            return value is None
        elif expected_type == "string":
            return isinstance(value, str)
        elif expected_type == "integer":
            return isinstance(value, int) and not isinstance(value, bool)
        elif expected_type == "number":
            return isinstance(value, (int, float)) and not isinstance(value, bool)
        elif expected_type == "boolean":
            return isinstance(value, bool)
        elif expected_type == "object":
            return isinstance(value, dict)
        elif expected_type == "array":
            return isinstance(value, list)
        return True

    def _is_valid_iso_datetime(self, s: str) -> bool:
        try:
            # Handles '2026-11-10T22:00:00Z', '2026-11-10T22:00:00+07:00', etc.
            normalized = s.replace("Z", "+00:00")
            datetime.fromisoformat(normalized)
            return True
        except Exception:
            return False


if __name__ == "__main__":
    import sys
    validator = ProtocolValidator()
    print(f"Loaded schemas: {list(validator.schemas.keys())}")
    
    if len(sys.argv) > 1 and sys.argv[1] == "all":
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        collab_dir = os.path.join(base_dir, ".ai-collaboration")
        all_passed = True
        checked = 0
        
        # Check tasks
        tasks_dir = os.path.join(collab_dir, "tasks")
        if os.path.isdir(tasks_dir):
            for fname in os.listdir(tasks_dir):
                if fname.endswith(".json"):
                    checked += 1
                    fpath = os.path.join(tasks_dir, fname)
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    valid, errs = validator.validate("task", data)
                    if valid:
                        print(f"PASS: [task] {fname}")
                    else:
                        print(f"FAIL: [task] {fname}: {errs}")
                        all_passed = False

        # Check results
        results_dir = os.path.join(collab_dir, "results")
        if os.path.isdir(results_dir):
            for fname in os.listdir(results_dir):
                if fname.endswith(".json"):
                    checked += 1
                    fpath = os.path.join(results_dir, fname)
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    valid, errs = validator.validate("result", data)
                    if valid:
                        print(f"PASS: [result] {fname}")
                    else:
                        print(f"FAIL: [result] {fname}: {errs}")
                        all_passed = False

        # Check reviews
        reviews_dir = os.path.join(collab_dir, "reviews")
        if os.path.isdir(reviews_dir):
            for fname in os.listdir(reviews_dir):
                if fname.endswith(".json"):
                    checked += 1
                    fpath = os.path.join(reviews_dir, fname)
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    valid, errs = validator.validate("review", data)
                    if valid:
                        print(f"PASS: [review] {fname}")
                    else:
                        print(f"FAIL: [review] {fname}: {errs}")
                        all_passed = False

        # Check examples
        ex_dir = os.path.join(collab_dir, "examples")
        if os.path.isdir(ex_dir):
            type_mapping = {
                "sample-task.json": "task",
                "sample-result.json": "result",
                "sample-review.json": "review"
            }
            for fname, stype in type_mapping.items():
                fpath = os.path.join(ex_dir, fname)
                if os.path.isfile(fpath):
                    checked += 1
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    valid, errs = validator.validate(stype, data)
                    if valid:
                        print(f"PASS: [{stype}] {fname}")
                    else:
                        print(f"FAIL: [{stype}] {fname}: {errs}")
                        all_passed = False

        # Check release gate
        gate_path = os.path.join(collab_dir, "qa", "release-gate.json")
        if os.path.isfile(gate_path):
            checked += 1
            with open(gate_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            valid, errs = validator.validate("release-gate", data)
            if valid:
                print(f"PASS: [release-gate] release-gate.json")
            else:
                print(f"FAIL: [release-gate] release-gate.json: {errs}")
                all_passed = False

        print(f"\nTotal files validated: {checked}. Overall status: {'PASS' if all_passed else 'FAIL'}")
        sys.exit(0 if all_passed else 1)

    elif len(sys.argv) > 2:
        schema_type = sys.argv[1]
        file_path = sys.argv[2]
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        valid, errs = validator.validate(schema_type, data)
        if valid:
            print(f"PASS: {file_path} is valid against {schema_type} schema.")
            sys.exit(0)
        else:
            print(f"FAIL: {file_path} failed validation:")
            for e in errs:
                print(f"  - {e}")
            sys.exit(1)
    else:
        print("Usage: validate_protocol.py all | validate_protocol.py <schema_name> <json_file>")
