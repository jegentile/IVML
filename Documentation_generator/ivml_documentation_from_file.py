__author__ = 'jgentile'


class IVMLDocumentationFromFile:
    def __init__(self,file_name):
        self.__file_name = file_name
        self.__file = open(file_name)
        print '    Document generator looking at ',file_name
        self.__ivml_object_documentation = '\0'
        self.__type = ''
        self.__ivml_non_required_attributes = {}
        self.__ivml_required_attributes = {}
        self.__svg_attributes = {}
        self.__events = {}
        self.__name = ""
        self.__description = ""

    def change_from_camel_case(self,string):
        str = string
        for i in range(65,91):
            str = str.replace(chr(i),'-'+chr(i+32))
        return str

    def parse(self):

        on_line = 0
        for line in self.__file:
            #check to see if the first line annotates an IVML object
            if on_line ==0:
                stripped_line = line.replace(' ','').replace('\t','').rstrip()
                array = stripped_line.split(':')

                #if the first line in the JavaScript file is not annotated for the documentaion, return
                if not array[0] == '//@defining' or not len(array) ==3:
                    print "      WARNING: First line of",self.__file_name," file does not have proper annotation. Skipping."
                    return
                print array
                if array[1] == 'ivml.chart':
                    self.__type = 'chart'
                if array[1] == 'ivml.visualElement':
                    self.__type = 'visual_element'
                if array[1] == 'ivml.group':
                    self.__type = 'group'

                print 'Name: ', array[2]," --- type:",self.__type
                self.__name = self.change_from_camel_case( array[2])

            if on_line > 0 and self.__type:
                if '//@' in line:
                    struct = 0
                    offset = 1
                    if '//@i' in line:
                        struct = self.__ivml_non_required_attributes
                    if '//@ir' in line:
                        struct = self.__ivml_required_attributes
                        offset = 2
                    if '//@s' in line:
                        struct = self.__svg_attributes
                    if '//@e' in line:
                        struct = self.__events
                    if '//@description' in line:
                        self.__description = line.split('//@description')[1].rstrip()
                    if not struct == 0:
                        attribute = line.strip().replace(' ','').replace('\t','').split(':')[0]
                        struct[self.change_from_camel_case(attribute)] = line.split('//@')[len(line.split('//@'))-1][offset:].strip().rstrip().replace('#','\#').replace('_','\_')
            on_line+=1

    '''
        print 'ivml',self.__ivml_attributes
        print 'svg',self.__svg_attributes
        print 'events',self.__events
    '''

    def get_type(self):
        if self.__type:
            return self.__type

    def get_ivml_required_attributes(self):
        return self.__ivml_required_attributes

    def get_ivml_non_required_attributes(self):
        return self.__ivml_non_required_attributes

    def get_svg_attributes(self):
        return self.__svg_attributes

    def get_event_attributes(self):
        return self.__events

    def get_name(self):
        return self.__name

    def get_description(self):
        return self.__description









