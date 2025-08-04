#Network Analysis JSON
import json
tasks = []
#es, el, ff, tf, et, ls, lf,
 #ES (current) = max (EF (prev))
 #EF (current) = ES (current) + Task time (current

# Add a task to the list
def generate_json_format(id, description, et=0, dep=[]):
    task = {
        "id": id,
        "description": description,
        "ET": et,   # Estimated Time
        "dependencies": dep,

        # These will be calculated
        "ES": 0,    # Earliest Start
        "EF": 0,    # Earliest Finish
        "LS": 0,    # Latest Start 
        "LF": 0,    # Latest Finish 
        "FF": 0,    # Free Float
        "TF": 0     # Total Float
    }
    return task

# Set Earliest Start and Finish times
def set_earliest_times(tasks):
    # Loop through tasks
    for task in tasks:
        if not task["dependencies"]:
            task["ES"] = 0
        else:
            # Find max EF of all dependencies
            max_ef = 0
            for dep_id in task["dependencies"]:
                for t in tasks:
                    if t["id"] == dep_id:
                        if t["EF"] > max_ef:
                            max_ef = t["EF"]
            task["ES"] = max_ef
        task["EF"] = task["ES"] + task["ET"]

# Set Earliest Start and Finish times
#LF (current) = min(LS (next))
#LS (current) = LF – Task time
def set_latest_times(tasks):
    # First, set LF of final tasks (those with no dependents) to their EF
    max_ef = max(task["EF"] for task in tasks)
    for task in tasks:
        if not any(task["id"] in t["dependencies"] for t in tasks):
            task["LF"] = max_ef
            task["LS"] = task["LF"] - task["ET"]

    # Backward pass
    for task in reversed(tasks):
        # Find all tasks that depend on the current task
        dependents = [t for t in tasks if task["id"] in t["dependencies"]]
        if dependents:
            task["LF"] = min(d["LS"] for d in dependents)
            task["LS"] = task["LF"] - task["ET"]

#TF (current) = LS (current) – ES (current)
def set_total_float(tasks):
    for task in tasks:
        task["TF"] = task["LS"] - task["ES"]

#FF (current) = min (ES (next)) – EF (current)
def set_free_float(tasks):
    for task in tasks:
        # Find all tasks that depend on the current task
        dependents = [t for t in tasks if task["id"] in t["dependencies"]]
        if dependents:
            min_es = min(dep["ES"] for dep in dependents)
            task["FF"] = min_es - task["EF"]
        else:
            # If no dependents, use total float as FF
            task["FF"] = task["TF"]


