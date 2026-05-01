"""
Spring 2026


Utility for the app launcher.

Creates a temporary directory and dumps private SSH key into it, then sets
restrictive permissions so that it can be used to SSH into the pis.

"""

# imports
import tempfile as tf
import os


# the key itself 
key = """-----BEGIN OPENSSH PRIVATE KEY-----
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
2/vrHNN2mqcAAAAFY2hlc3MBAgMEBQY=
-----END OPENSSH PRIVATE KEY-----
"""


# functions
"""
Creates private key in the specified directory. If no directory name passed, defaults to making a temp dir. 

Can optionally specify the name of the key. Defaults to 'chess-key'.

Returns the full path to the chess key file.
"""
def create_private_key(directory=None, name="chess-key"):
    base_dir = directory or os.path.join(os.path.expanduser("~"), ".chessapp")

    os.makedirs(base_dir, exist_ok=True)

    fpath = os.path.join(base_dir, name)

    with open(fpath, "w") as f:
        f.write(key)

    os.chmod(fpath, 0o600)

    return fpath
