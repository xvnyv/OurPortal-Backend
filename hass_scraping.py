from algoliasearch.search_client import SearchClient
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os
import pathlib
import requests

load_dotenv()

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred, {
    'projectId': 'ourportal-e0a9c'
})

algolia_client = SearchClient.create(
    os.getenv('ALGOLIA_APPLICATION_ID'), os.getenv('ALGOLIA_ADMIN_API_KEY'))
algolia_index = algolia_client.init_index('dev_ourportal')

db = firestore.client()

headers = requests.utils.default_headers()
headers.update({'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Safari/605.1.15'})

stupid_prereq_spellings = ['pre-requisite',
                           'pre-requisites', 'prerequisite', 'prerequisites', 'learning objectives', 'learning objective', 'measurable outcomes', 'pre-requisite/co-requisite', 'pre-requisites/co-requisites', 'prerequisite/corequisite', 'prerequisites/corequisites']


def save_to_db(subject_code, title, instructor, description, type_):
    doc_ref = db.collection(u'modules').document(subject_code)
    doc_ref.set({
        u'subject_code': subject_code,
        u'title': title,
        u'instructor': instructor,
        u'description': description,
        u'type': type_
    })


def import_to_db(filepath):
    f = open(filepath, 'r')
    modules = json.load(f)

    for mod in modules:
        doc_ref = db.collection(u'modules').document(mod['subject_code'])
        doc_ref.set(mod)


def hass():
    url = 'https://hass.sutd.edu.sg/education/undergraduate-subjects/subjects-schedule/'
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    url = soup.find("a").get('href')
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    for subject in soup.find_all('a', target='_self'):
        subject_url = subject.get('href')
        subject_req = requests.get(subject_url, headers=headers)
        subject_soup = BeautifulSoup(subject_req.content, 'html.parser')

        entry_title = subject_soup.select('h1.entry-title')[0].text.strip()
        subject_code = entry_title.split(' ')[0]
        title = entry_title.lstrip(subject_code).strip()

        content = subject_soup.find('div', class_='post-content')
        description = ''
        instructor = ''
        for p in content.find_all('p'):
            instructor_p = p.find('a')
            if instructor_p == None:
                description += p.text.strip() + '\n'
            elif instructor_p.text != 'Access to Course Syllabus':
                instructor = instructor_p.text

        description = description.strip()

        save_to_db(subject_code, title, instructor, description, 'HASS')

        print(f'Subject Code: {subject_code}')
        print(f'Title: {title}')
        print(f'Instructor: {instructor}')
        print(f'Description: {description}\n====================\n')


def epd():
    url = 'https://epd.sutd.edu.sg/education/undergraduate/undergraduate-courses/'
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    url = soup.find("a").get('href')
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    for mod in soup.find_all('a', class_='button-sutd'):
        mod_url = mod.get('href')
        if mod_url[8:11] == 'epd':
            mod_req = requests.get(mod_url, headers=headers)
            mod_soup = BeautifulSoup(mod_req.content, 'html.parser')

            entry_title = mod_soup.find('h1').text
            subject_code = entry_title.split(' ')[0]
            title = entry_title.lstrip(subject_code).strip()

            description_div = mod_soup.find_all('div', class_='fusion-text')
            description = ''
            if len(description_div) == 0:
                description_div = mod_soup.find('div', class_='post-content')
                for el in description_div.find_all('p'):
                    if el.find('strong') != None:
                        break
                    description += el.text + '\n'
            else:
                for div in description_div:
                    is_correct_div = div.find('ul') != None

                    if is_correct_div:
                        description_para = div.find_all(['p', 'li', 'h4'])
                        for el in description_para:
                            if el.name == 'h4':
                                break
                            description += el.text + '\n'
                        break

            save_to_db(subject_code, title, '', description.strip(), 'EPD')

            print(f'Subject code: {subject_code}')
            print(f'Title: {title}')
            print(f'Description: {description}\n====================\n')


def esd():
    url = "https://esd.sutd.edu.sg/academics/undergraduate-programme/courses/"

    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    url = soup.find("a").get('href')
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    modules = []

    for mod in soup.find_all('h2', class_='blog-shortcode-post-title'):
        mod_a = mod.findChildren('a', recursive=False)
        if len(mod_a) > 0:
            try:
                mod_url = mod_a[0].get('href')
                mod_req = requests.get(mod_url, headers=headers)
                mod_soup = BeautifulSoup(mod_req.content, 'html.parser')
                subject_code, title = mod_soup.find(
                    'h2', class_='fusion-post-title').text.split(maxsplit=1)

                print(f'Subject code: {subject_code}')
                print(f'Title: {title}')

                description = ''
                reached_actual_content = False
                for el in mod_soup.find('div', class_='post-content').find_all(['p', 'h4', 'ul', 'li']):
                    if el.name == 'h4' and el.text.lower() in stupid_prereq_spellings:
                        break
                    elif el.name == 'p':
                        description += el.text + '\n'
                    elif el.name == 'ul':
                        for el_c in el.findChildren('li'):
                            description += '\u2022 ' + el_c.text + '\n'

                print(f'Description: {description}\n====================\n')

                modules.append({'subject_code': subject_code, 'title': title, 'type': 'ESD', 'instructor_first_name': '',
                                'instructor_last_name': '', 'description': description, 'total_slots': 50, 'available_slots': 50})
            except:
                print('this one died\n====================\n')

    f = open(f'{pathlib.Path(__file__).parent.absolute()}/esd.json', 'w')
    json.dump(modules, f)


def istd():
    url = "https://istd.sutd.edu.sg/education/undergraduate/course-catalogue/"
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    url = soup.find("a").get('href')
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    modules = []

    for mod in soup.find_all('h2', class_='blog-shortcode-post-title'):
        mod_a = mod.findChildren('a', recursive=False)
        if len(mod_a) > 0:
            try:
                mod_url = mod_a[0].get('href')
                mod_req = requests.get(mod_url, headers=headers)
                mod_soup = BeautifulSoup(mod_req.content, 'html.parser')
                subject_code, title = mod_soup.find(
                    'h1', class_='entry-title').text.split(maxsplit=1)

                print(f'Subject code: {subject_code}')
                print(f'Title: {title}')

                description = ''
                reached_actual_content = False
                for el in mod_soup.find_all(['p', 'h4', 'ul', 'li']):
                    if not reached_actual_content:
                        reached_actual_content = el.name == 'h4' and el.text.lower() == 'course description'
                    if reached_actual_content:
                        if el.name == 'h4' and el.text.lower() in stupid_prereq_spellings:
                            break
                        elif el.name == 'p':
                            description += el.text + '\n'
                        elif el.name == 'ul':
                            for el_c in el.findChildren('li'):
                                description += '\u2022 ' + el_c.text + '\n'

                print(f'Description: {description}\n====================\n')

                modules.append({'subject_code': subject_code, 'title': title, 'type': 'ISTD', 'instructor_first_name': '',
                                'instructor_last_name': '', 'description': description, 'total_slots': 50, 'available_slots': 50})
            except:
                print('this one died\n====================\n')

    f = open(f'{pathlib.Path(__file__).parent.absolute()}/istd.json', 'w')
    json.dump(modules, f)


def asd():
    url = "https://asd.sutd.edu.sg/programme/undergraduate-courses/full-course-listing/"
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    url = soup.find("a").get('href')
    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.content, 'html.parser')

    modules = []

    for mod in soup.find_all('h2', class_='blog-shortcode-post-title'):
        mod_a = mod.findChildren('a', recursive=False)
        if len(mod_a) > 0:
            try:
                mod_url = mod_a[0].get('href')
                mod_req = requests.get(mod_url, headers=headers)
                mod_soup = BeautifulSoup(mod_req.content, 'html.parser')
                subject_code, title = mod_soup.find(
                    'h1', class_='entry-title').text.split(maxsplit=1)

                print(f'Subject code: {subject_code}')
                print(f'Title: {title}')

                description = ''
                reached_actual_content = False

                for el in mod_soup.find('div', class_='post-content').findChildren('p'):
                    if el.find('strong') != None:
                        break
                    description += el.text + '\n'

                print(f'Description: {description}\n====================\n')

                modules.append({'subject_code': subject_code, 'title': title, 'type': 'ASD', 'instructor_first_name': '',
                                'instructor_last_name': '', 'description': description, 'total_slots': 50, 'available_slots': 50})
            except:
                print('this one died\n====================\n')

    f = open(f'{pathlib.Path(__file__).parent.absolute()}/asd.json', 'w')
    json.dump(modules, f)


def export_to_json():
    f = open(f'{pathlib.Path(__file__).parent.absolute()}/modules.json', 'w')
    modules = []
    docs = db.collection(u'modules').stream()

    for doc in docs:
        modules.append(doc.to_dict())

    json.dump(modules, f)


def edit_instructor_name():
    f = open(f'{pathlib.Path(__file__).parent.absolute()}/modules.json', 'r')
    modules = json.load(f)

    for module in modules:
        if module['instructor'] == '':
            module['instructor_first_name'] = ''
            module['instructor_last_name'] = ''
        else:
            (module['instructor_first_name'], module['instructor_last_name']
             ) = module['instructor'].split(maxsplit=1)
        del module['instructor']
    f.close()

    f = open(f'{pathlib.Path(__file__).parent.absolute()}/modules.json', 'w')
    json.dump(modules, f)


def edit_instructor_name_firebase():
    docs = db.collection(u'modules').stream()

    for doc in docs:
        dict_doc = doc.to_dict()
        try:
            if dict_doc['instructor'] != '':
                first_name, last_name = dict_doc['instructor'].split(
                    maxsplit=1)
                doc.reference.update({
                    u'instructor': firestore.DELETE_FIELD,
                    u'instructor_first_name': first_name,
                    u'instructor_last_name': last_name
                })
            else:
                doc.reference.update({
                    u'instructor': firestore.DELETE_FIELD,
                    u'instructor_first_name': '',
                    u'instructor_last_name': ''
                })
        except:
            doc.reference.update({
                u'instructor': firestore.DELETE_FIELD,
                u'instructor_first_name': '',
                u'instructor_last_name': ''
            })


def update_availability():
    docs = db.collection(u'modules').where(
        'type', 'in', ['EPD', 'HASS']).stream()

    for doc in docs:
        dict_doc = doc.to_dict()
        doc.reference.update({
            u'total_slots': 50,
            u'available_slots': 50,
        })


def main():
    import_to_db(f'{pathlib.Path(__file__).parent.absolute()}/asd.json')


if __name__ == '__main__':
    main()
