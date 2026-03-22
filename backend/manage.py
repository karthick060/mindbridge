#!/usr/bin/env python
"""Django management CLI entry point."""
import os
import sys

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mindbridge.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError("Couldn't import Django. Make sure your virtualenv is active.") from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
