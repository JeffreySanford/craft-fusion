from setuptools import setup, find_packages

setup(
    name='sumerian_mythology_project',  
    version='1.0.0',
    packages=find_packages(include=[
        'thinc', 'thinc.*', 'thinc.tests', 'thinc.tests.mypy', 'thinc.tests.mypy.outputs',
        'training', 'src'
    ]),
    install_requires=[
        'beautifulsoup4==4.11.1',
        'requests==2.26.0',
        'spacy==3.3.0',
        'cython==0.29.24',
        'thinc==8.0.10',
        'numpy==1.21.2',
        'preshed==3.0.5',
        'murmurhash==1.0.7',
        'setuptools==57.4.0',
        'matplotlib==3.4.3',
        'pandas==1.3.3',
        'transformers==4.38.0',
        'datasets==1.12.1',
        'peft==0.0.1',
        'psutil==5.8.0',
        'concurrent==0.1.0'
    ],
    python_requires='>=3.8',
    classifiers=[
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'License :: OSI Approved :: MIT License',
    ],
    include_package_data=True,
)
