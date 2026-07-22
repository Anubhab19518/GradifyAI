import logging
import os

# Define the root log directory (relative to the root project directory)
ROOT_LOG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../logs"))

def setup_logger(module_name):
    """
    Sets up a logger for the specified module, saving logs in a dedicated subfolder.
    :param module_name: The name of the module or file (e.g., 'text_extraction').
    :return: A logger instance.
    """
    # Create the logs directory if it doesn't exist
    if not os.path.exists(ROOT_LOG_DIR):
        os.makedirs(ROOT_LOG_DIR)

    # Create a subdirectory for the module's logs
    module_log_dir = os.path.join(ROOT_LOG_DIR, module_name)
    if not os.path.exists(module_log_dir):
        os.makedirs(module_log_dir)

    # Log file path
    log_file = os.path.join(module_log_dir, f"{module_name}.log")

    # Set up logging configuration
    logger = logging.getLogger(module_name)
    logger.setLevel(logging.DEBUG)  # Change to INFO or WARNING for production

    # Create handlers for file and console output
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)  # Console output can have a different level
    console_handler.setFormatter(logging.Formatter('%(message)s'))

    # Add handlers to the logger
    if not logger.handlers:  # Avoid adding duplicate handlers
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

    return logger

def get_logger(module_name):
    """
    A wrapper to quickly get a logger for a specific module.
    :param module_name: Name of the module or file.
    :return: Configured logger instance.
    """
    return setup_logger(module_name)

