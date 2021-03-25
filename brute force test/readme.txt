change "options.binary_location" to the path of chrome
change "chrome_driver" to the path of chrome driver
change the port "driver.get("http://localhost:9998")" 9998 to the port using

if can not find id, try to check

username=driver.find_element_by_id("username")
password=driver.find_element_by_id("password")
driver.find_element_by_class_name("submit")

three name of the element.